#!/usr/bin/perl -w
# Read-only RESTful API to GSL Special Functions
# Jonathan "Duke" Leto  <jonathan@leto.net> - Nov 2008
use strict;
use CGI ();
use CGI::Carp qw(fatalsToBrowser);
use Data::Dumper;
use Scalar::Util    qw/reftype/; 
use Math::GSL::SF   qw/:all/;
use File::Slurp     qw/slurp/;
use Regexp::Common  qw/number/;
use Math::GSL::Errno qw/:all/;
use JSON;
$|++;

BEGIN { gsl_set_error_handler_off() } 

$ENV{REQUEST_METHOD} = 'GET' unless defined $ENV{REQUEST_METHOD};
my %WHITELIST = map { $_ => 1 } 
                grep { $_ !~ /GSL|_e|_array|INCORRECT/ } 
                sort @Math::GSL::SF::EXPORT_OK ;

my $base_url = 'http://leto.net/rest/gsl.cgi';
my $q        = CGI->new;
my $hal      = slurp 'tmpl/hal.tmpl';
my $func_select = slurp 'tmpl/gsl_sf_functions.tmpl';

my $title    = qq{<a href="$base_url/=">GSL REST API</a>};
my $MAX_POINTS = 500;
### 
sub as_json($$) { 
    my ($q,$data) = @_;
    return $q->header('application/json') . to_json($data, { pretty => 1 } );
}

   
sub cleanup_spew($) {
    my $q = shift;
    if (ref $@ and reftype $@ eq 'HASH') {
        my $ERROR = $@;
        print $q->header( -status => $ERROR->{status}, -type => 'text/html' ) .
            $q->h1( $ERROR->{title} ) .
            $q->p( $ERROR->{message} ) if $ERROR->{message};
    } else {
        my $ERROR = $@;
        print $q->header( -status => 500, -type => 'text/html' ) .
            $q->title('Server Error, bitches!') .
            "<font color='red'>$ERROR</font>";
    }
    exit;
}

sub spew($$;$) {
    my ($status, $title, $message) = @_;

    die {
        status  => $status, 
        title   => $title, 
        message => $message,
    };
}

sub GET($$) {
    my ($path, $code) = @_;
    return unless $q->request_method eq 'GET' or $q->request_method eq 'HEAD';
    return unless $q->path_info =~ $path;
    $code->();
    exit;
}

sub is_valid($) {
   my $function = shift;
   return exists $WHITELIST{"gsl_sf_$function"} ;
}

sub get_value($$) {
    my ($f,$x) = @_;
    my $y;
    # close your eyes
    my @mode_funcs = qw/ airy_Ai airy_Bi ellint_Kcomp ellint_Ecomp
                         ellint_Dcomp /;
    if ($f ~~ @mode_funcs )  {
        $x = "$x,0"; # take care of dumb "mode" argument 
    }

    $y = eval qq{ gsl_sf_$f($x) };

    if ( $@ ) {
        warn $@;
        cleanup_spew($q);
    }
    if ($y =~ /nan/) {
        $y = 'NaN';
    }
    return $y;
}

eval {

    GET qr{^/=/?$} => sub {
        print $q->header('text/html') . $q->h1($title) .
              $q->pre('GSL Web API pre-alpha');
    };
    GET qr{^/=/sf/$} => sub {
        print $q->header('text/html') . $q->h1($title) .   
              $q->h2('Special Function Documentation') .
              $q->p('Example:') . 
              $q->dl(
                    $q->dt(qq{ <a href="$base_url/=/sf/bessel_J0/2.582">$base_url/=/sf/<font color="red">bessel_J0</font>/2.582</a> } ),
                    $q->dd('Returns the Bessel Function J0 applied at x=2.582 as JSON'),
                ) .
              $q->h2('Allowed Functions') .
              $func_select . 
              qq{ <b>( <input type="text" id="x" size="4"> ) </b> <input type="submit" value="="> <input type="text" id="y" size="8"> };
    };
    my $num_regex        = qr/$RE{num}{real}{-base => 10}{-keep}/;
    my $num_nokeep       = qr/$RE{num}{real}{-base => 10}/;
    my $function_regex   = qr/([A-z\d_]+)/;

    GET qr{^/=/sf/$function_regex/$num_regex$} => sub {
        my ($function, $x) = ($1,$2);

        if ( is_valid($function) ) {
            print as_json($q, { value => get_value($function, $x ) });
        } else {
            spew 503, 'No', $hal;
        }
    };

    GET qr{^/=/sf/$function_regex/($num_nokeep):($num_nokeep):(\d+)$} => sub {
        my ($function, $start, $end, $points) = ($1, $2, $3, $4);
        unless ( $start < $end ) {
            spew 503, 'Start must be less than end';
        }
        unless ( $points > 0 && $points < $MAX_POINTS ) {
            spew 503, "Please specify between 1 and $MAX_POINTS points";
        }
        if ( is_valid($function) ) {
            my @linspace = map { $start + $_/$points } (1 .. $points);
            my @values   = map { get_value($function, $_) } @linspace;
            print as_json($q, { 
                    'values' => \@values,
                    "start"  => $start,
                    "end"    => $end,
                    "points" => $points, 
            });
        } else {
            spew 503, 'Invalid Function', $hal;
        }

    };
};
cleanup_spew($q) if $@; 

print $q->header(-status => 404, -type => 'text/html') . $hal;
